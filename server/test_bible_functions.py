# -*- coding: utf-8 -*-
"""Testing file to handle bible function testing

Authors: Brandon Fan
Last Edit Date: 11/17/2017
"""

import pytest
from bible_functions import Bible

BIBLE = Bible('../bible-files/english-web-bible.json')
BIBLE_DATA = BIBLE.get_book('Genesis')
BIBLE_CHAPTER = BIBLE.get_chapter(BIBLE_DATA, '2')
BIBLE_VERSES = BIBLE.get_verse(BIBLE_CHAPTER, '5')


def test_books():
    """Tests total amount of books in bible"""
    assert len(BIBLE.books) == 66
    assert BIBLE.books[0] == 'genesis'


def test_parse_query():
    """Tests pares query algorithm"""

    # test regular
    results = BIBLE.parse_query('Genesis 1:1')
    assert len(results.keys()) == 2
    assert list(results.keys()) == ['book', 'queries']
    assert results['book'] == 'Genesis'
    assert len(results['queries']) == 1

    # test with spaces and other problems
    results = BIBLE.parse_query('"Gene\'sis  "1:"1   ')
    assert len(results.keys()) == 2
    assert list(results.keys()) == ['book', 'queries']
    assert results['book'] == 'Genesis'
    assert len(results['queries']) == 1
    assert len(results['queries'][0]['verses']) == 1

    # with ranges
    results = BIBLE.parse_query('Genesis 1:1-5')
    assert len(results.keys()) == 2
    assert list(results.keys()) == ['book', 'queries']
    assert results['book'] == 'Genesis'
    assert len(results['queries']) == 1
    assert len(results['queries'][0]['verses']) == 5

    # with ranges and different chapters
    results = BIBLE.parse_query('Genesis 1:1-5; 2:5')
    assert len(results.keys()) == 2
    assert list(results.keys()) == ['book', 'queries']
    assert results['book'] == 'Genesis'
    assert len(results['queries']) == 2

    # with two ranges annd different chapters
    results = BIBLE.parse_query('Genesis 1:1,4,5; 2:5-7')
    assert len(results.keys()) == 2
    assert list(results.keys()) == ['book', 'queries']
    assert results['book'] == 'Genesis'
    assert len(results['queries']) == 2
    assert len(results['queries'][0]['verses']) == 3
    assert len(results['queries'][1]['verses']) == 3

    # with erroneous text
    results = BIBLE.parse_query('Genesis. \"1:1,4,5;\" \'2:5-\'7')
    assert len(results.keys()) == 2
    assert list(results.keys()) == ['book', 'queries']
    assert results['book'] == 'Genesis'
    assert len(results['queries']) == 2
    assert len(results['queries'][0]['verses']) == 3
    assert len(results['queries'][1]['verses']) == 3


def test_book_data():
    """Tests get_book function"""
    assert len(BIBLE_DATA.keys()) == 3
    assert list(BIBLE_DATA.keys()) == ['name', 'data', 'metadata']
    assert isinstance(BIBLE_DATA['name'], str)
    assert isinstance(BIBLE_DATA['data'], list)
    assert len(BIBLE_DATA['data']) == 50
    assert isinstance(BIBLE_DATA['metadata'], dict)
    assert len(BIBLE_DATA['metadata'].keys()) == 2


def test_chapter_data():
    """Tests get_chapter function"""
    assert len(BIBLE_CHAPTER.keys()) == 3
    assert list(BIBLE_CHAPTER.keys()) == [
        'chapter', 'chapter_number', 'verses']
    assert isinstance(BIBLE_CHAPTER['verses'], list)
    assert len(BIBLE_CHAPTER['verses']) == 25
    assert isinstance(BIBLE_CHAPTER['chapter'], str)
    assert isinstance(BIBLE_CHAPTER['chapter_number'], str)
    assert int(BIBLE_CHAPTER['chapter_number'])
    assert isinstance(BIBLE_CHAPTER['verses'][0], dict)


def test_verse_data():
    """Tests get_verse function"""
    assert len(BIBLE_VERSES.keys()) == 3
    assert list(BIBLE_VERSES.keys()) == ['verse', 'verse_number', 'text']
    assert isinstance(BIBLE_VERSES['verse'], str)
    assert isinstance(BIBLE_VERSES['verse_number'], str)
    assert int(BIBLE_VERSES['verse_number'])
    assert isinstance(BIBLE_VERSES['text'], str)


def test_bible_data():
    """Tests get_data function"""
    data = BIBLE.get_data('Genesis', '2', [2, 4])
    assert len(data.keys()) == 3
    assert list(data.keys()) == ['id', 'verse_data', 'combined_text']
    assert isinstance(data['combined_text'], str)
    assert isinstance(data['id'], int)
    assert len(data['verse_data']) == 2


def test_erroneous():
    """Tests erroneous problems, check if they raise errors"""
    with pytest.raises(ValueError):
        BIBLE.get_book('abc')
    with pytest.raises(ValueError):
        BIBLE.get_chapter(BIBLE_DATA, '55')
    with pytest.raises(ValueError):
        BIBLE.get_verse(BIBLE_CHAPTER, '52')
    with pytest.raises(ValueError):
        BIBLE.get_data('CDF', '2', [2, 4])
