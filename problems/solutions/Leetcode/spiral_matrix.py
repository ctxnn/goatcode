class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        ans = []
        while matrix: 
            # step 1 : pop out the whole first row as it is 
            ans += (matrix.pop(0))

            # step 2 : last elements of the other all lists in order 
            if matrix and matrix[0]:
                for rows in matrix: 
                    ans.append(rows.pop())
            
            # step 3 : reverse order of the last row 
            if matrix: 
                ans+=(matrix.pop()[::-1])

            # step 4 : first element of all rows left in reverse 
            if matrix and matrix[0]:
                for row in matrix[::-1]:
                    ans.append(row.pop(0))

        return ans 
