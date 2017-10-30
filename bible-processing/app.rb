require 'bible_parser'
bible = BibleParser.new(File.open('../english-web-bible.xml'))
bible.verses.each do |verse|
    print verse.text
end
