class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        low = 1
        high = max(piles)

        while low <= high:
            mid = low + (high - low) // 2

            total_hours = self.calculate_total_hours(piles, mid)

            if total_hours <= h:
                # This speed works, but try a slower speed.
                high = mid - 1
            else:
                # This speed is too slow.
                low = mid + 1

        return low

    def calculate_total_hours(
        self,
        piles: List[int],
        speed: int
    ) -> int:
        total_hours = 0

        for pile in piles:
            # Same as ceil(pile / speed)
            total_hours += (pile + speed - 1) // speed

        return total_hours
