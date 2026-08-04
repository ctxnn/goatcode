class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        left = 0  # Pointer for placing non-zero elements

        # Iterate with right pointer
        for right in range(len(nums)):
            if nums[right] != 0:
                # Swap elements if right pointer finds a non-zero
                nums[left], nums[right] = nums[right], nums[left]
                left += 1  # Move left pointer forward
                
