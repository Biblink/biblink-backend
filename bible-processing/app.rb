# app.rb
# Description: Processes Bible XML and handles converting to json file
# Author: Brandon Fan
# Last Edit Date: Octobe 30, 2017

# import required packages
require 'bible_parser'
require 'json'

# set path to save compiled json file
final_data_path = '../bible-files/english-web-bible.json'

bible = BibleParser.new(File.open('../bible-files/english-web-bible.xml')) # instantiate bible parser
books = File.readlines('../bible-files/books.txt') # get all books of protestant bible

books.each do |book|
    book.strip! # strip lines of any spaces and new lines
end

bible_data = []
bible.books.each do |book| # go through each book
    if books.include? book.to_s # if book is in book of wanted books, get chapters
        puts 'Creating Data For Book: ' + book.to_s
        book_data = {'name' => book.to_s, 'data' => []} # set up basic object 
        book.chapters.each do |chapter|
            # append chapter_data to hash of each book
            chapter_data = {'chapter' => chapter.to_s, 'chapter_number' => chapter.to_s.split(/\s/)[-1], 'verses' => []}
            chapter.verses.each do |verse|
                # create json objects for each verse
                verse_data = {'verse' => verse.to_s, 'verse_number' => verse.to_s.split(':')[-1], 'text' => verse.text.strip!}
                chapter_data['verses'].push(verse_data) 
            end
            book_data['data'].push(chapter_data) 
        end
        bible_data.push(book_data) 
    end
end

# finish by outputting results to json file
File.open(final_data_path, 'w') do |f|
    f.write(JSON.pretty_generate(bible_data))
end
puts 'Data was outputted to ' + final_data_path