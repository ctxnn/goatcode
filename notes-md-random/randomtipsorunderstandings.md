1. adding "ios_base::sync_with_stdio(false);" can increase the code speed by 5x it helps in fast I/O
2. lets take this equation :
$$|a_1 - x|^c + |a_2 - x|^c + \cdots + |a_n - x|^c
$$ 
we want to minimize the sum of this equation for $c = 1$ and $c = 2$ 
    1. for $c = 1$: $x$ should be the median 
    2. for $c = 2$: $x$ should be the average
3. Huffman coding is a greedy algorithm that constructs an optimal code for compressing a given string(used when  the prefix of a code can not be the code itself)