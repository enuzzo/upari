import importlib.util,json,tempfile,unittest,subprocess
from pathlib import Path
module=importlib.util.spec_from_file_location('package_statistics',Path(__file__).with_name('package-statistics.py'));m=importlib.util.module_from_spec(module);module.loader.exec_module(m)
class PackageStatistics(unittest.TestCase):
 def fixture(self,root):
  world=json.loads(Path('public/statistics/world.json').read_text());world['indicators']=world['indicators'][:1];world['countries']=[c for c in world['countries'] if c['id']=='ITA'];
  meta=root/'meta.json';meta.write_text(json.dumps(world));geo=json.loads(Path('public/statistics/countries.geojson').read_text());geo['features']=[f for f in geo['features'] if f['properties']['statCode']=='ITA'];bound=root/'geo.json';bound.write_text(json.dumps(geo));csv=root/'data.csv';csv.write_text('region,year,indicator,value\nITA,2000,birth,0\nITA,2002,birth,6.3\n');return csv,meta,bound
 def test_zero_missing_and_exact_region_join(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);csv,meta,bound=self.fixture(root);out=m.package(csv,meta,bound)
   self.assertEqual(out['data']['values']['birth']['ITA'],[0,None,6.3]);self.assertEqual(out['data']['years'],[2000,2001,2002]);self.assertEqual(out['boundaries']['features'][0]['properties']['statCode'],'ITA')
 def test_rejects_duplicate_and_unmatched_region(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);csv,meta,bound=self.fixture(root);csv.write_text('region,year,indicator,value\nITA,2000,birth,1\nITA,2000,birth,2\n')
   with self.assertRaises(ValueError):m.package(csv,meta,bound)
   csv.write_text('region,year,indicator,value\nXYZ,2000,birth,1\n')
   with self.assertRaises(ValueError):m.package(csv,meta,bound)
 def test_shared_validator_accepts_documented_bundle_and_rejects_closed_license(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);csv,meta,bound=self.fixture(root);out=m.package(csv,meta,bound);file=root/'out.json';file.write_text(json.dumps(out));command=['node','scripts/validate-statistics.mjs',str(file)]
   self.assertEqual(subprocess.run(command,capture_output=True).returncode,0)
   out['data']['indicators'][0]['license']='All rights reserved';file.write_text(json.dumps(out));self.assertNotEqual(subprocess.run(command,capture_output=True).returncode,0)
if __name__=='__main__':unittest.main()
