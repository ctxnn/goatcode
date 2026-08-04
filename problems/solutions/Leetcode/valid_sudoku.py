class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        # validate columns
        for i in range(9):
            s = set()
            for j in range(9):
                item = board[j][i]
                if item in s:
                    return False
                if item != '.':
                    s.add(item)

        # validate rows
        for i in range(9):
            s = set()
            for j in range(9):
                item = board[i][j]
                if item in s:
                    return False
                if item != '.':
                    s.add(item)

        # validate 3x3
        for row in range(0, 9, 3):
            for col in range(0, 9, 3):
                s = set()
                for i in range(3):
                    for j in range(3):
                        item = board[row+i][col+j]
                        if item in s:
                            return False
                        elif item != '.':
                            s.add(item)

        return True
