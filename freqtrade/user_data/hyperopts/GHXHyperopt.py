from freqtrade.optimize.hyperopt import IHyperOpt
from pandas import DataFrame
class GHXHyperopt(IHyperOpt):
    @staticmethod
    def hyperopt_parameters(space):
        return []