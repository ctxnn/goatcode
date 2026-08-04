from collections import deque 
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        # will apply bfs here (dfs is recursive while bfs is iterative)
        # pattern recognition here is that we have to find a "region" in a "grid" 
        if not grid:
            return 0
        def bfs(r,c): 
            q = deque() 
            visited.add((r,c))
            q.append((r,c))
            
            while q: 
                row, col = q.popleft()
                directions = [[1,0],[0,1],[-1,0],[0,-1]]

                for dr, dc in directions:
                    r,c = row+dr, col+dc 

                    if r in range(rows) and c in range(columns) and grid[r][c]=='1' and (r,c) not in visited:
                        q.append((r,c))
                        visited.add((r,c))

        count = 0 
        visited = set()
        rows = len(grid)
        columns = len(grid[0])
        for row in range(rows): 
            for column in range(columns): 
                if grid[row][column] == "1" and (row,column) not in visited: 
                    bfs(row,column)
                    count+=1
        return count  # time complexity - O(m*n)



        
