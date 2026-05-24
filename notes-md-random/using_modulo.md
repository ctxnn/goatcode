# modulo (%)

when to use wrt [this question](C_Rotation.py) 

S = a b c d e f
indices: 0 1 2 3 4 5
n = 6

Now say we shift right by 2 positions.

0 → 2
1 → 3
2 → 4
3 → 5
4 → 0
5 → 1

So after 3 (for example), index 4 doesn’t go to 6 — it wraps back to 0.

That wrapping is the core of why we use modulo.
Because “wrap around” mathematically means take remainder when exceeding a boundary.

Modulo = wrapping operator

(4 + 2) % 6 = 0
(5 + 2) % 6 = 1

The string length n defines how many distinct positions exist in the cycle.
So every index operation happens on a ring of size n —
after you pass n-1, you return to 0.

Mathematically, that means indices “live” in a cyclic group of order n:
$${Z}_n = \{ 0, 1, 2, …, n-1 \}$$
and addition on this group is defined as:
$$(a + b) \text{ mod } n$$
That’s literally the rotation behavior.

So you use modulo n not because someone said so, but because:

rotation means you’re working in a cyclic world,
and modulo arithmetic is how we represent cyclic systems numerically.


>general pattern
You know modulo applies when:
	1.	You have something that repeats or loops around after a fixed length (like a circle, clock, or ring buffer).
	2.	You are incrementing or decrementing an index or position.
	3.	You need to make sure the result stays within a fixed range (e.g., valid indices).

Some classic triggers:
	•	rotations of arrays / strings → (% n)
	•	circular queues → front = (front + 1) % n
	•	clock arithmetic → (hour + k) % 12
	•	cyclic games (“turn after n players”) → (player + 1) % n

If it’s circular or periodic → modulo is automatically implied.

When you see words like:

“rotate”, “wrap”, “loop”, “cycle”, “repeat every n steps”

You should immediately think:

“Okay, this is a cyclic index system → I’ll probably use % n somewhere.”