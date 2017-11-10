## About TetNet – Genetic Algorithms and Tetris
#### TetNet (see: Tetris + Skynet)  is a program that uses genetic algorithms to build an AI that can play Tetris.

![TetNet running](http://idreesinc.com/images/tetnet_in_action.gif)

*TetNet running after 25 generations of evolution*

## How it works

TetNet uses the tried and true method of genetic algorithms in order to create and refine the AI. Genetic algorithms work by creating a population of “genomes” that have multiple “genes”, representing parameters for the algorithm. Each of these individuals in the population is evaluated and a “fitness” score for each genome is produced. Like in real life, the fittest individuals (AKA the individuals with the highest fitness score) would go on to reproduce for the next generation and the genes that made these individuals fit would hopefully be passed down. Mutation also occurs, randomly editing genes in the children of the genomes in order to hopefully create more beneficial features. Each new generation should become fitter than the last, allowing the genetic algorithm to evolve to better solve the given problem (in this case, to get the highest score in Tetris in 500 moves).

#### To learn more and see it in action, [click here!](http://idreesinc.com/about-tetnet/)
