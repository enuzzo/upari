"""Offline distributor adapter: CF NetCDF u/v in m/s -> Upari vector JSON.

Optional xarray/numpy/scipy/h5netcdf/h5py dependencies live outside the web app.
Obtain the scientific file yourself; this script has no network or authentication.
Coordinates and velocity variables are explicit, extra non-singleton dimensions
require --select DIM=INDEX. No interpolation, missing cells remain null.
"""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
import xarray as xr
from urllib.parse import urlsplit

def convert(input_path,output_path,*,kind,source,url,period,resolution,level,u='u',v='v',latitude='latitude',longitude='longitude',time='time',time_index=None,stride=8,selections=None):
    if stride<1:raise ValueError('Stride must be positive')
    origin=urlsplit(url)
    if origin.scheme!='https' or not origin.netloc or origin.username or origin.password or origin.query or origin.fragment:raise ValueError('Use a public HTTPS source URL without credentials')
    if kind not in ['wind','currents'] or (time_index is not None and time_index<0) or any(v<0 for v in (selections or {}).values()):raise ValueError('Invalid kind or selection index')
    with xr.open_dataset(input_path) as ds:
        if time not in ds or ds[time].size==0:raise ValueError('CF timestamp required')
        if ds[time].size>1 and time_index is None:raise ValueError('Select exactly one time with --time-index')
        instant=np.asarray(ds[time].values).reshape(-1)[time_index or 0]
        if not np.issubdtype(instant.dtype,np.datetime64) or np.isnat(instant):raise ValueError('CF UTC timestamp must decode as datetime64')
        stamp=np.datetime_as_string(instant,unit='s')+'Z'
        lat,lon=ds[latitude],ds[longitude]
        if lat.ndim!=1 or lon.ndim!=1 or lat.dims==lon.dims:raise ValueError('Separate rectilinear latitude/longitude axes required')
        lat_dim,lon_dim=lat.dims[0],lon.dims[0]
        if str(lat.attrs.get('units','')) not in ['degrees_north','degree_north'] or str(lon.attrs.get('units','')) not in ['degrees_east','degree_east']:raise ValueError('CF angular units required')
        lat_values=np.asarray(lat.values,dtype=float);lon_values=(np.asarray(lon.values,dtype=float)+180)%360-180
        if not np.isfinite(lat_values).all() or not np.isfinite(lon_values).all() or np.any(np.abs(lat_values)>90):raise ValueError('Invalid coordinates')
        lat_indices=np.argsort(lat_values)[::stride];lon_sorted=np.argsort(lon_values,kind='stable');_,unique=np.unique(np.round(lon_values[lon_sorted],8),return_index=True);lon_indices=lon_sorted[unique][::stride]
        latitudes=lat_values[lat_indices].tolist();longitudes=lon_values[lon_indices].tolist()
        if min(len(latitudes),len(longitudes))<2 or len(latitudes)*len(longitudes)>260000 or np.any(np.diff(latitudes)<=0):raise ValueError('Invalid or oversized decimated grid')
        components=[]
        for key in [u,v]:
            data=ds[key]
            if str(data.attrs.get('units','')).strip() not in ['m/s','m s-1','m s^-1','meter/sec']:raise ValueError('Velocity must be in m/s')
            select={}
            for dim in data.dims:
                if dim in [lat_dim,lon_dim]:continue
                if dim in ds[time].dims:select[dim]=time_index or 0
                elif dim in (selections or {}):select[dim]=selections[dim]
                elif data.sizes[dim]==1:select[dim]=0
                else:raise ValueError('Explicit --select required for '+dim)
            values=np.asarray(data.isel(select).transpose(lat_dim,lon_dim).isel({lat_dim:lat_indices,lon_dim:lon_indices}).values).reshape(-1)
            components.append([round(float(n),3) if np.isfinite(n) and abs(n)<=150 else None for n in values])
        f=dict(version=1,kind=kind,source=source,sourceURL=url,time=stamp,period=period,nativeResolution=resolution,sampleResolution=float(min(np.diff(longitudes))),level=level,latitudes=latitudes,longitudes=longitudes,u=components[0],v=components[1])
    output_path=Path(output_path);output_path.parent.mkdir(parents=True,exist_ok=True);temporary=output_path.with_suffix(output_path.suffix+'.tmp');temporary.write_text(json.dumps(f,separators=(',',':'),allow_nan=False)+'\n');temporary.replace(output_path)
    return f

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('input',type=Path);p.add_argument('output',type=Path)
    for key in ['kind','source','url','period','resolution','level']:p.add_argument('--'+key,required=True,**({'choices':['wind','currents']} if key=='kind' else {}))
    for key,default in [('u','u'),('v','v'),('latitude','latitude'),('longitude','longitude'),('time','time')]:p.add_argument('--'+key,default=default)
    p.add_argument('--time-index',type=int);p.add_argument('--stride',type=int,default=8);p.add_argument('--select',action='append',default=[]);a=p.parse_args()
    f=convert(a.input,a.output,**{k:getattr(a,k) for k in ['kind','source','url','period','resolution','level','u','v','latitude','longitude','time','time_index','stride']},selections={k:int(v) for k,v in (x.split('=',1) for x in a.select)})
    print(json.dumps(dict(time=f['time'],cells=len(f['u']),inputSHA256=hashlib.sha256(a.input.read_bytes()).hexdigest(),outputSHA256=hashlib.sha256(a.output.read_bytes()).hexdigest())))
