class Solution:
    def maxArea(self, height: List[int]) -> int:
        # brute force approach O(N^2)
        # res = 0 
        # for l in range(len(height)):
        #     for r in range(l+1, len(height)):
        #         area = (r-l) * min(height[r],height[l])
        #         res = max(area,res)
        # return res
        # optimal approach O(N)
        res = 0 
        l = 0 
        r = len(height)-1
        while l < r:
            area = (r-l) * min(height[r],height[l])
            res = max(area,res)
            if height[l] < height[r]:
                l+=1
            else: 
                r-=1
        return res
