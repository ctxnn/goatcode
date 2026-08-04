class Solution:
    def nextGreatestLetter(
        self,
        letters: List[str],
        target: str
    ) -> str:
        left = 0
        right = len(letters) - 1
        answer = -1

        while left <= right:
            mid = left + (right - left) // 2

            if letters[mid] > target:
                answer = mid
                right = mid - 1
            else:
                left = mid + 1

        if answer == -1:
            return letters[0]

        return letters[answer]
