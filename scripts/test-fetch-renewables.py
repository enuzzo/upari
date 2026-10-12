import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('renewables', Path(__file__).with_name('fetch-renewables.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class Extraction(unittest.TestCase):
    def test_decodes_dimension_positions_not_names_and_retains_absence(self):
        # Deliberately non-default order. Published zero is not a missing row.
        raw = {'id':['time','geo','unit','nrg_bal','freq'], 'size':[2,2,1,1,1],
               'dimension':{k:{'category':{'index':v}} for k,v in {
                   'time':{'2004':0,'2005':1},'geo':{'IT':0,'EU27_2020':1},
                   'unit':{'PC':0},'nrg_bal':{'REN':0},'freq':{'A':0}}.items()},
               'value':{'0':0,'1':22,'3':23}}
        self.assertEqual(module.extract(raw, {'IT':'ITA'}, [2004,2005]), {'ITA':[0,None]})

    def test_refuses_wrong_measure_and_unhandled_selected_flags(self):
        raw={'id':['freq','nrg_bal','unit','geo','time'],'size':[1,1,1,1,1],
             'dimension':{k:{'category':{'index':v}} for k,v in {
                 'freq':{'A':0},'nrg_bal':{'REN':0},'unit':{'PC':0},'geo':{'IT':0},'time':{'2004':0}}.items()},
             'value':{'0':5},'status':{'0':'p'}}
        with self.assertRaisesRegex(ValueError,'flag'): module.extract(raw, {'IT':'ITA'}, [2004])
        raw.pop('status');raw['dimension']['unit']['category']['index']={'GWH':0}
        with self.assertRaises(ValueError): module.extract(raw, {'IT':'ITA'}, [2004])

    def test_enforces_snapshot_years_even_for_broader_local_input(self):
        raw={'id':['freq','nrg_bal','unit','geo','time'],'size':[1,1,1,1,3],
             'dimension':{k:{'category':{'index':v}} for k,v in {
                 'freq':{'A':0},'nrg_bal':{'REN':0},'unit':{'PC':0},'geo':{'IT':0},
                 'time':{'2003':0,'2004':1,'2025':2}}.items()},'value':{'0':3,'1':4,'2':25}}
        self.assertEqual(module.extract(raw,{'IT':'ITA'},[2003,2004,2025]),{'ITA':[None,4,None]})

if __name__=='__main__': unittest.main()
