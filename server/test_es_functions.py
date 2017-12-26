# -*- coding: utf-8 -*-
"""Testing file to handle bible function testing

Authors: Brandon Fan
Last Edit Date: 11/17/2017
"""

import pytest
from es_functions import SearchES

ELASTICSEARCH = SearchES()


def test_search():
    """Tests an elastic search query and see if functions is returning proper values"""
    results = ELASTICSEARCH.search('God')
    assert len(results) == 10
    assert len(results[0].keys()) == 4
    assert list(results[0].keys()) == [
        'verse', 'verse_number', 'text', 'score']
