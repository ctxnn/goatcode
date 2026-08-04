class Solution:
    def minimumAbsDifference(self, arr: List[int]) -> List[List[int]]:
        ans = []
        arr.sort()

        differences = []

        # Calculate differences between adjacent values
        for i in range(len(arr) - 1):
            difference = arr[i + 1] - arr[i]
            differences.append(difference)

        minimum_difference = min(differences)

        # Collect pairs having the minimum difference
        for i in range(len(arr) - 1):
            a = arr[i]
            b = arr[i + 1]

            if b - a == minimum_difference:
                ans.append([a, b])

        return ans

"""
class Solution:
    def minimumAbsDifference(self, arr: List[int]) -> List[List[int]]:
        arr.sort()

        ans = []
        min_diff = float("inf")

        left = 0
        right = 1

        while right < len(arr):
            diff = arr[right] - arr[left]

            if diff < min_diff:
                min_diff = diff
                ans = [[arr[left], arr[right]]]

            elif diff == min_diff:
                ans.append([arr[left], arr[right]])

            left += 1
            right += 1

        return ans
"""
