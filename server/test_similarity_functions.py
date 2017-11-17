from similarity_functions import Similarity
SIM = Similarity('../bible-files/english-web-bible.json',
                 '../dl-files/glove.6B.200d.txt')

def test_similarity():
    values = SIM.get_similar_values('Genesis 1:1', total_values=20)
    assert len(values) == 20
    assert isinstance(values[0], dict)
