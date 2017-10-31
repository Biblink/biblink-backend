'''
bible.py
Description: Bible class to handle communication with bible.json
Author: Brandon Fan
Last Edit Date: 10/30/2017
'''
import json
import os
import random


class Bible(object):
    def __init__(self, bible_file_path):
        if bible_file_path.endswith('.json') and \
                os.path.isfile(bible_file_path):
            # grab json file
            bible_file = open(bible_file_path)
            self.bible = json.load(bible_file)
            # delete bible_file variable from memory
            del bible_file
        else:
            raise ValueError(
                'Please enter a proper .json file, you entered: {0}'
                .format(bible_file_path))
        self.books = [book['name'] for book in self.bible]

    def get_data(self, book, chapter, verses=[]):
        response = {'data': []}
        response['id'] = random.randint(1, 1000000)
        if not isinstance(book, str):
            raise ValueError('Please enter a proper string for book name')
            return
        book_data = self.get_book(book)
        chapter_data = self.get_chapter(book_data, chapter)
        verses_data = []
        for verse in verses:
            verses_data.append(self.get_verse(chapter_data))
        response['data'] = verses_data
        text = ''
        for verse_data in verses_data:
            value = '<n>{0}</n>{1}'.format(
                verse_data['verse_number'], verse_data['text'])
            text += value
        response['text'] = text
        return response

    def get_book(self, book):
        book = book.strip()
        if book not in self.books:
            raise ValueError(
                'Please enter a proper book of the protestant bible.')
            return
        return self.bible[self.books.index(book)]  # get data from book

    def get_chapter(self, book_data, chapter):
        if int(chapter) >= len(book_data['data']):
            raise ValueError(
                'Please enter a proper chapter of the book: {0}'
                .format(book_data['name']))
            return

        return book_data['data'][int(chapter) + 1]

    def get_verse(self, chapter_data, verse):
        if int(verse) >= len(chapter_data['verses']):
            raise ValueError(
                'Please enter a proper verse of the chapter: {0}'
                .format(chapter_data['chapter']))
            return
        return chapter_data['verses'][int(verse) + 1]
