"""Numerical converter fixtures only; never distributed as scientific observations."""
import importlib.util,tempfile,unittest,json,os
from pathlib import Path
import numpy as np
import xarray as xr
spec=importlib.util.spec_from_file_location('pack',Path(__file__).with_name('package-netcdf.py'));pack=importlib.util.module_from_spec(spec);spec.loader.exec_module(pack)
class ConverterTests(unittest.TestCase):
    def dataset(self,times=1):
        ds=xr.Dataset({'u':(('time','latitude','longitude'),np.tile([[1,np.nan,3],[4,5,6]],(times,1,1))),'v':(('time','latitude','longitude'),np.ones((times,2,3)))},coords={'time':np.array(['2024-01-01','2024-01-02'][:times],dtype='datetime64[ns]'),'latitude':[2.,0.],'longitude':[180.,181.,182.]})
        for key in ['u','v']:ds[key].attrs['units']='m s-1'
        ds.latitude.attrs['units']='degrees_north';ds.longitude.attrs['units']='degrees_east';return ds
    def convert(self,ds,**options):
        with tempfile.TemporaryDirectory(prefix='upari-nc-') as directory:
            inp=Path(directory)/'fixture.nc';out=Path(directory)/'test.json';ds.to_netcdf(inp,engine=os.environ.get('UPARI_TEST_NETCDF_ENGINE','scipy'))
            return pack.convert(inp,out,kind='currents',source='Technical fixture',url='https://noaa.gov/',period='Test',resolution='Test',level='Test',stride=1,**options)
    def test_sort_normalize_mask_and_time(self):
        f=self.convert(self.dataset());self.assertEqual(f['time'],'2024-01-01T00:00:00Z');self.assertEqual(f['longitudes'],[-180,-179,-178]);self.assertEqual(f['latitudes'],[0,2]);self.assertEqual(f['u'],[4,5,6,1,None,3]);self.assertNotIn('NaN',json.dumps(f))
    def test_ambiguous_time_and_wrong_units(self):
        with self.assertRaisesRegex(ValueError,'exactly one time'):self.convert(self.dataset(2))
        self.assertEqual(self.convert(self.dataset(2),time_index=1)['time'],'2024-01-02T00:00:00Z')
        ds=self.dataset();ds.u.attrs['units']='knots'
        with self.assertRaisesRegex(ValueError,'m/s'):self.convert(ds)
    def test_ambiguous_depth_requires_choice(self):
        ds=self.dataset().expand_dims(depth=[15,30])
        with self.assertRaisesRegex(ValueError,'select'):self.convert(ds)
        self.assertEqual(len(self.convert(ds,selections={'depth':1})['u']),6)
if __name__=='__main__':unittest.main()
