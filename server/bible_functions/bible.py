# -*- coding: utf-8 -*-
"""Bible class to handle communication with bible.json

Author: Brandon Fan
Last Edit Date: 11/17/2017
Todo:
    * implement @property functions
"""
import json
import os
import random
import re
import csv


class Bible(object):
    """Bible that handles communicating and generating data from a bible.json

    Talks to various types of bibles (EWB, Cherokee etc.). Has various methods
    to talk to process data file and grab information such as verses text, metadata on
    bible books etc. and return a dictionary response for each

    Attributes:
        bible (dict): Bible data loaded from bible_file_path JSON file.
        books (list): List of books in the Protestant bible.
    """

    def __init__(self, bible_file_path, nt_metadata_path, ot_metadata_path):
        if bible_file_path.endswith('.json') and os.path.isfile(bible_file_path):
            # grab json file
            bible_file = open(bible_file_path, encoding='utf-8-sig')
            self.bible = json.load(bible_file)
            # delete bible_file variable from memory
            del bible_file
        else:
            self._throw_value_error('Please enter a proper .json file, you' +
                                    ' entered: {0}'
                                    .format(bible_file_path))
        self.book_metadata = {}
        if nt_metadata_path.endswith('.csv') and os.path.isfile(nt_metadata_path):
            nt_file = open(nt_metadata_path, encoding='utf-8-sig')
            nt_writer = csv.reader(nt_file)
            for book_metadata in nt_writer:
                book_name = book_metadata[0].strip()
                self.book_metadata[book_name] = {}
                self.book_metadata[book_name]['author'] = book_metadata[1].strip()
                self.book_metadata[book_name]['date'] = book_metadata[2].strip()
            nt_file.close()
        if ot_metadata_path.endswith('.csv') and os.path.isfile(ot_metadata_path):
            ot_file = open(ot_metadata_path, encoding='utf-8-sig')
            ot_writer = csv.reader(ot_file)
            for book_metadata in ot_writer:
                book_name = book_metadata[0].strip()
                self.book_metadata[book_name] = {}
                self.book_metadata[book_name]['author'] = book_metadata[1].strip()
                self.book_metadata[book_name]['date'] = book_metadata[2].strip()
            ot_file.close()
        self.books = [book['name'].lower() for book in self.bible]
        self._query_parser = re.compile(r'(\d\s)?([\w\.]+)\s+([\d:,\-\s\;]+)')

    def parse_query(self, string_query):
        """Function to parse string query to get book and corresponding queries

        Uses a regular expression to return the book and to process
        chapter and verses from the string. Generates a dictionary
        response with the book and queries that can then be fed into

        Args:
            string_query (str): query string to parse

        Returns:
            (dict): dictionary of book and queries
            response is below::

                {
                    'book': (str),
                    'queries': (list)
                }

        Raises:
            ValueError: if query string is not parseable
        """
        # create return response
        response = {'book': '', 'queries': []}
        string_query = re.sub(r'[\'\"\.]', '', string_query)
        # match query with regular expression
        match = self._query_parser.match(string_query)
        if not match:
            self._throw_value_error('Please enter a parseable query')
        # get groups of data
        information = list(match.groups())
        # if no number in book (i.e. Genesis) then
        # remove the first value in array
        if information[0] is None:
            information = information[1:]
        # get book value
        response['book'] = ' '.join([i.strip() for i in information[:-1]]).capitalize()
        # split based on semicolons in verse info (i.e. 34:11; 45:32)
        chapter_verse_data = information[-1].split(';')
        for data in chapter_verse_data:
            # create temp_data
            temp_data = {'chapter': '', 'verses': []}
            # split each chapter_verse (i.e. 34:11 or 34:11-15)
            chapter_and_verse = data.split(':')
            # set chapter
            temp_data['chapter'] = chapter_and_verse[0].strip()
            # get all verses either number or range
            verses = [i.strip()
                      for i in chapter_and_verse[1].split(',')]
            # iterate through verses
            for verse in verses:
                # if verse number is range
                if '-' in verse:
                    verse_ranges = verse.split('-')
                    start_range = int(verse_ranges[0])
                    end_range = int(verse_ranges[1])
                    # generate range of verses
                    temp_verses = [i for i in range(
                        start_range, end_range + 1)]
                    # add to verse array
                    temp_data['verses'] += temp_verses
                else:
                    # append integer of verse
                    temp_data['verses'].append(int(verse))
            # append each chapter to query
            response['queries'].append(temp_data)
        return response

    def get_metadata(self, book):
        """Function to get metadata from a corresponding book data dictionary

        Reads in data from book parameter and retrieves the metadata

        Args:
            book (string): book name

        Returns:
            (dict): dictionary of metadata
            response is below::

                {
                    'author': (str),
                    'date': (str)
                }

        Raises:
            ValueError: if book data is invalid
        """
        try:
            return self.book_metadata[book.strip()]
        except Exception:
            raise ValueError('Please provide a proper book data dictionary')

    def get_data(self, book, chapter, verses=None):
        """Function to get verses from a book and a chapter

        Uses a book, chapter and verses parameters to retrieve
        specific bible verses from the json file. After gathering the
        information, returns it in a dictionary as a response.

        Args:
            book (str): book name
            chapter (str): chapter name
            verses (list, optional): list of verses

        Returns:
            (dict): dictionary of response data
            response is below::

                {
                    'id': (int),
                    'verse_data': (list)
                    'combined_text': (str)
                }

        Raises:
            ValueError: if book name is not a proper string
        """
        response = {'id': None, 'verse_data': []}
        response['id'] = random.randint(1, 1000000)
        if not isinstance(book, str):
            self._throw_value_error(
                'Please enter a proper string for book name')
        book_data = self.get_book(book)
        chapter_data = self.get_chapter(book_data, chapter)
        verses_data = []
        if verses is None or verses is []:
            for verse in chapter_data['verses']:
                verses_data.append(verse)
        else:
            for verse in verses:
                verses_data.append(self.get_verse(chapter_data, verse))
        response['verse_data'] = verses_data
        response['chapters'] = list(range(1, len(book_data['data']) + 1))
        response['book_name'] = book_data['name']
        text = ''
        for verse_data in verses_data:
            # use <n> tags as html for frontend
            value = '<n>{0}</n> {1}'.format(
                verse_data['verse_number'], verse_data['text'])
            text += value
        response['combined_text'] = text
        return response

    def get_all_books(self):
        """Function to return list of all books

        Returns all books of the bible

        Returns:
            (list): list of all books  
        """
        return self.books

    def get_book(self, book):
        """Function to get book data from self.bible

        Uses a book name to reference the book data in self.bible.
        Generates a dictionary response with the book data

        Args:
            book (str): book name to parse

        Returns:
            (dict): dictionary of book data
            response is below::

                {
                    'name': (str),
                    'data': (list),
                    'metadata': (dict),
                }

        Raises:
            ValueError: if book is not in self.books
        """
        book = book.strip().lower()
        if book not in self.books:
            self._throw_value_error(
                'Please enter a proper book of the protestant bible.')
        return self.bible[self.books.index(book)]  # get data from book

    def get_chapter(self, book_data, chapter):
        """Function to get chapter data from book_data

        Uses the chapter parameter and gets the chapter from the book_data
        parameter. Generates a dictionary response with the
        chapter data

        Args:
            book_data (dict): book_data to be referenced
            chapter (str or int): chapter name to be referenced

        Returns:
            (dict): dictionary of chapter data
            response is below::

                {
                    'chapter': (str),
                    'chapter_number': (str),
                    'verses': (list of dict),
                }

        Raises:
            ValueError: if chapter is not a proper chapter in book
        """
        if int(chapter) > len(book_data['data']):
            self._throw_value_error('Please enter a proper ' +
                                    'chapter of the book: {0}'
                                    .format(book_data['name']))
        return book_data['data'][int(chapter) - 1]

    def get_verse(self, chapter_data, verse):
        """Function to get verse data from chapter_data

        Uses the verse parameter and gets the verse from the chapter_data
        parameter. Generates a dictionary response with the verse data.

        Args:
            chapter_data (dict): chapter_data to be referenced
            verse (str or int): verse name to be referenced

        Returns:
            (dict): dictionary of verse data
            response is below::

                {
                    'verse': (str),
                    'verse_number': (str),
                    'text': (str),
                }

        Raises:
            ValueError: if chapter is not a proper chapter in book
        """
        if int(verse) >= len(chapter_data['verses']):
            self._throw_value_error('Please enter a proper verse of the ' +
                                    'chapter: {0}'
                                    .format(chapter_data['chapter']))
        return chapter_data['verses'][int(verse) - 1]

    @staticmethod
    def _throw_value_error(information):
        raise ValueError(information)
