require 'bible_parser'
bible = BibleParser.new(File.open('../bible-files/english-web-bible.xml'))
books = File.readlines('../bible-files/books.txt')
books.each do |book|
    book.strip!
end
bible_data = []
bible.books.each do |book|
    if books.include? book.to_s
        puts book
        book_data = {'name' => book, 'data' => []}
        book.chapters.each do |chapter|
            puts chapter
            # append to a hash of each book
            chapter_data = {'chapter' => chapter, 'verses' => []}
            chapter.verses.each do |verse|
                verse_data = {'verse_number' => verse, 'text' => verse.text}
                chapter_data['verses'].push(verse_data)
            end
            book_data['data'].push(chapter_data)
        end
        bible_data.push(book_data)
    end
end
