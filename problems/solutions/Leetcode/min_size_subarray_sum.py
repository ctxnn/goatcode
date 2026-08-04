class Solution: # time complexity O(n)
    def minSubArrayLen(self, target: int, nums: list[int]) -> int:
        left = 0
        current_sum = 0
        minimum_length = float("inf")

        for right in range(len(nums)):
            current_sum += nums[right]

            while current_sum >= target:
                window_length = right - left + 1
                minimum_length = min(minimum_length, window_length)

                current_sum -= nums[left]
                left += 1

        return 0 if minimum_length == float("inf") else minimum_length
