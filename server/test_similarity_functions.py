# -*- coding: utf-8 -*-
"""Testing file to handle similarity functions testing

Authors: Brandon Fan
Last Edit Date: 11/17/2017
"""

from similarity_functions import Similarity
SIM = Similarity('../bible-files/english-web-bible.json',
                 '../dl-files/glove.6B.200d.txt', _testing=True)

def test_similarity():
    """Tests similarity values and see if function is returning proper values"""
    values = SIM.get_similar_values('Genesis 1:1', total_values=20)
    assert len(values) == 20
    assert isinstance(values[0], dict)
