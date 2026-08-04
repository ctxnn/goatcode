class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return sorted(s) == sorted(t) # TIME COMPLEXITY O(NLOGN)

        """ 
        more better time complexity : 
        from collections import Counter

        def isAnagram(self, s: str, t: str) -> bool:
            return Counter(s) == Counter(t) # O(n)

        """
    
