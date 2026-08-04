from typing import List


class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        # Example:
        # temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
        #
        # res[i] tells us how many days we must wait after day i
        # to find a warmer temperature.
        #
        # Initially, we do not know the answer for any day,
        # so every answer starts as 0.
        #
        # res = [0, 0, 0, 0, 0, 0, 0, 0]

        res = [0] * len(temperatures)

        # The stack stores:
        # [temperature, index]
        #
        # It contains days for which we have not found
        # a warmer future temperature yet.
        stack = []

        for i, temp in enumerate(temperatures):

            # ---------------------------------------------------------
            # DRY RUN
            # ---------------------------------------------------------

            # i = 0, temp = 73
            # stack is empty, so while loop does not run.
            # Append [73, 0].
            #
            # stack = [[73, 0]]
            # res   = [0, 0, 0, 0, 0, 0, 0, 0]

            # i = 1, temp = 74
            # Top of stack has temperature 73.
            # 74 > 73, so today is warmer than day 0.
            #
            # Pop [73, 0].
            # Number of days waited = current index - old index
            #                       = 1 - 0
            #                       = 1
            #
            # res[0] = 1
            #
            # stack becomes empty.
            # Append [74, 1].
            #
            # stack = [[74, 1]]
            # res   = [1, 0, 0, 0, 0, 0, 0, 0]

            # i = 2, temp = 75
            # 75 > 74, so day 2 is warmer than day 1.
            #
            # Pop [74, 1].
            # res[1] = 2 - 1 = 1
            #
            # Append [75, 2].
            #
            # stack = [[75, 2]]
            # res   = [1, 1, 0, 0, 0, 0, 0, 0]

            # i = 3, temp = 71
            # 71 is not greater than 75.
            # We still have not found a warmer day for day 2.
            #
            # Append [71, 3].
            #
            # stack = [[75, 2], [71, 3]]
            # res   = [1, 1, 0, 0, 0, 0, 0, 0]

            # i = 4, temp = 69
            # 69 is not greater than 71.
            #
            # Append [69, 4].
            #
            # stack = [[75, 2], [71, 3], [69, 4]]
            # res   = [1, 1, 0, 0, 0, 0, 0, 0]

            # i = 5, temp = 72
            #
            # Compare with top: 72 > 69
            # Pop [69, 4].
            # res[4] = 5 - 4 = 1
            #
            # stack = [[75, 2], [71, 3]]
            #
            # Compare again: 72 > 71
            # Pop [71, 3].
            # res[3] = 5 - 3 = 2
            #
            # stack = [[75, 2]]
            #
            # Compare again: 72 is not greater than 75.
            # Stop popping.
            #
            # Append [72, 5].
            #
            # stack = [[75, 2], [72, 5]]
            # res   = [1, 1, 0, 2, 1, 0, 0, 0]

            # i = 6, temp = 76
            #
            # Compare with top: 76 > 72
            # Pop [72, 5].
            # res[5] = 6 - 5 = 1
            #
            # stack = [[75, 2]]
            #
            # Compare again: 76 > 75
            # Pop [75, 2].
            # res[2] = 6 - 2 = 4
            #
            # stack becomes empty.
            #
            # Append [76, 6].
            #
            # stack = [[76, 6]]
            # res   = [1, 1, 4, 2, 1, 1, 0, 0]

            # i = 7, temp = 73
            # 73 is not greater than 76.
            #
            # Append [73, 7].
            #
            # stack = [[76, 6], [73, 7]]
            # res   = [1, 1, 4, 2, 1, 1, 0, 0]
            #
            # Days 6 and 7 remain 0 because no warmer day
            # appears after them.

            # Check whether today's temperature is warmer
            # than the unresolved temperature at the top.
            while stack and temp > stack[-1][0]:
                previous_temp, previous_index = stack.pop()

                # The difference between the indices gives
                # the number of days that the previous day waited.
                res[previous_index] = i - previous_index

            # Today now waits for its own warmer future day.
            stack.append([temp, i])

        return res
