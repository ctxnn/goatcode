
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        rows = len(matrix)
        cols = len(matrix[0])

        row = 0
        col = cols - 1

        while row < rows and col >= 0:
            current = matrix[row][col]

            if current == target:
                return True
            elif current < target:
                row += 1
            else:
                col -= 1

        return False # this solution is just trivial you have to look at the matrix and understand the pattern and then solve it, the striver video was really helpful for this
