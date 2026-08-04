class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        # flatten the 2d array -> 1 d array hypothetically for that you will have to use this indexing trick 
        left = 0 
        rows = len(matrix)
        cols = len(matrix[0])
        right = rows * cols - 1
        while left <= right:
            mid = (left + right) // 2
            row = mid // cols # cols here is no of column 
            column = mid % cols
            if matrix[row][column] == target: 
                return True 
            elif matrix[row][column] > target: 
                right = mid - 1
            else: 
                left = mid + 1
        return False


# typical solution without That
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        for i in range(len(matrix)):
            for j in range(len(matrix[0])):
                if matrix[i][j] == target: 
                    return True
        return False
