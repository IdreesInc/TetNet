# TetNet – Evolutionary Tetris AI using Genetic Algorithms

Made with ❤ and frustration by [Idrees Hassan](https://idreesinc.com?utm_source=github&utm_medium=readme&utm_campaign=tetnet)

### TetNet (see: Tetris + Skynet)  is a program that uses genetic algorithms to build an AI that can play Tetris.

![TetNet running](http://idreesinc.com/images/tetnet_in_action.gif)

*TetNet running after 25 generations of evolution*

### To learn more, check out my write-up [here!](http://idreesinc.com/about-tetnet.html?utm_source=github&utm_medium=readme&utm_campaign=tetnet)

#### Or [click here](https://cdn.rawgit.com/IdreesInc/TetNet/master/Tetris.html) to run the demo and see it in action!

## How it works

TetNet uses the tried and true method of genetic algorithms in order to create and refine the AI. Genetic algorithms work by creating a population of “genomes” that have multiple “genes”, representing parameters for the algorithm. Each of these individuals in the population is evaluated and a “fitness” score for each genome is produced. Like in real life, the fittest individuals (AKA the individuals with the highest fitness score) would go on to reproduce for the next generation and the genes that made these individuals fit would hopefully be passed down. Mutation also occurs, randomly editing genes in the children of the genomes in order to hopefully create more beneficial features. Each new generation should become fitter than the last, allowing the genetic algorithm to evolve to better solve the given problem (in this case, to get the highest score in Tetris in 500 moves).

![XKCD](https://imgs.xkcd.com/comics/genetic_algorithms.png)

### Genetic Algorithm Breakdown

__id: The unique identifier for the genome.

__rowsCleared:__ The weight of each row cleared by the given move

__weightedHeight:__ The weight of the "weightedHeight" variable, which is the absolute height of the highest column to the power of 1.5

__cumulativeHeight:__ The weight of the sum of all the column's heights

__relativeHeight:__ The weight of the highest column minus the lowest column

__holes:__ The weight of the sum of all the empty cells that have a block above them (basically, cells that are unable to be filled)

__roughness:__ The weight of the sum of absolute differences between the height of each column (for example, if all the shapes on the grid lie completely flat, then the roughness would equal 0).

This genome represents an algorithm that will be used to "score" each possible move that could be made (for example, dropping an I block into the 6th column). The values for each property represent the weight of each variable in the scoring equation. So for example, if the given move cleared 2 rows when fully executed, and the "rowsCleared" parameter equaled 0.5, then the result would be 1 (which would then be added against all the other variables multiplied by parameters in order to obtain the move's score).

A "move" occurs when a new shape appears at the top of the grid. The genome scores each possible move by rating each move with genome's parameters, and then looks at every move that could occur AFTER this move is made and rates that too. It can do this because Tetris tells the player what the upcoming shape will be, so the AI can use this to make sure that the current move works well with the next move to maximize score.

Of all the possible moves, the moves with the highest score (as determined by the genome) is executed and the process repeats until the genome either loses or hits the maximum number of moves allowed (in this case, 500). Once the game is over for the genome, the resultant score is used as this genome's fitness score, which will later be compared against all of the other genomes in the population. The game is reset to the state it was at before the last genome was evaluated and the next genome is evaluated until all the genomes in the population have a fitness score. Then, the population has evolved and a new generation begins (They grow up so fast!).


__To learn more and see how different behaviors emerged during the development process, visit my site [here](http://idreesinc.com/about-tetnet.html?utm_source=github&utm_medium=readme&utm_campaign=tetnet)__
