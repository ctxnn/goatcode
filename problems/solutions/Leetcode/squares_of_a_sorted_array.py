"""
class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        ans = []
        for i in nums: 
            ans.append(i*i)
        return sorted(ans)  NOTE : THIS SOLUTION IS ONLY O(NLOGN) THIS CAN BE SOLVED BY USING TWO POINTERS APPROACH 
"""

class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [0] * n
        i, j, k = 0, n - 1, n - 1

        while i <= j:
            left_sq = nums[i] ** 2
            right_sq = nums[j] ** 2

            if left_sq > right_sq:
                result[k] = left_sq
                i += 1
            else:
                result[k] = right_sq
                j -= 1
            k -= 1

        return result
