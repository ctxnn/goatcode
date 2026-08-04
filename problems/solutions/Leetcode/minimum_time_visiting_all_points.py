total = 0
for i in range(len(points) - 1):
    dx = abs(points[i+1][0] - points[i][0])
    dy = abs(points[i+1][1] - points[i][1])
    total += max(dx, dy)
return total
