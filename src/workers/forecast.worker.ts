import { calculateForecast } from '../lib/orbits';
import type { OrbitData, Place } from '../types';
self.onmessage=(e:MessageEvent<{orbit:OrbitData;place:Place;minElevation:number}>)=>{try{self.postMessage({forecast:calculateForecast(e.data.orbit,e.data.place,e.data.minElevation)});}catch(err){self.postMessage({error:err instanceof Error?err.message:'Calcolo non riuscito.'});}};
