import { createPrompt, createSelection } from "bun-promptx";

//CONSTANTS

let regex: RegExp = /^[A-D][0-3]$/;

const NUM_DIRECTIONS = 4;
const SMALL_SHIP_SIZE = 2;
const LARGE_SHIP_SIZE = 3;

const SMALL_BOARD = 4;
const MEDIUM_BOARD = 5;
const LARGE_BOARD = 6;

const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

const ASCII_CONVERT = 65;

const INVALID_COORDINATE: [number, number] = [-1, -1];

const youWinText = `__   _______ _   _   _    _ _____ _   _
\\ \\ / /  _  | | | | | |  | |_   _| \\ | |
 \\ V /| | | | | | | | |  | | | | |  \\| |
  \\ / | | | | | | | | |/\\| | | | | . ' |
  | | \\ \\_/ / |_| | \\  /\\  /_| |_| |\\  |
  \\_/  \\___/ \\___/   \\/  \\/ \\___/\\_| \\_/`;

//Types

type Board = Cell[][];

type Cell = {
  type: "large" | "small" | "empty";
  id?: number;
  hit: boolean;
};

type Ship = {
  type: "large" | "small";
  size: number;
  id?: number;
  direction?: number;
  coordinates: [number, number][];
};

//FUNCTIONS

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getCellString = (cell: Cell, debug: boolean) => {
  switch (cell.type) {
    case "empty":
      if (cell.hit) return "❗";
      return "-";
    case "large":
      if (cell.hit || debug) return "🔵";
      return "-";
    case "small":
      if (cell.hit || debug) return "🟠";
      return "-";
  }
};

const PrintBoard = (board: Board, debug = false) => {
  const displayBoard: { [key: string]: string[] } = {};

  for (let row = 0; row < board.length; row++) {
    displayBoard[String.fromCharCode(row + ASCII_CONVERT)] = board[row].map(
      (cell) => getCellString(cell, debug)
    );
  }

  console.table(displayBoard);
};

const InitBoard = (size: number): Board => {
  const board: Board = [];
  for (let i = 0; i < size; i++) {
    let row: Cell[] = [];
    for (let j = 0; j < size; j++) {
      row.push({ type: "empty", hit: false });
    }
    board.push(row);
  }
  setShip(board, "small");
  setShip(board, "large");
  if (board.length >= MEDIUM_BOARD) setShip(board, "small");
  if (board.length >= LARGE_BOARD) setShip(board, "large");

  return board;
};

const setShip = (board: Board, type: "small" | "large") => {
  let ship: Ship = {
    type: type,
    size: type == "small" ? SMALL_SHIP_SIZE : LARGE_SHIP_SIZE,
    coordinates: [],
  };
  ship.coordinates = getRandomizedShipCoordinates(board, ship);
  for (let coordinate of ship.coordinates) {
    board[coordinate[0]][coordinate[1]].type = type;
  }
};

const getRandomizedShipCoordinates = (
  board: Board,
  ship: Ship
): [number, number][] => {
  ship.coordinates = [];
  ship.coordinates.push([
    Math.floor(Math.random() * board.length),
    Math.floor(Math.random() * board.length),
  ]);
  if (board[ship.coordinates[0][0]][ship.coordinates[0][1]].type != "empty")
    return getRandomizedShipCoordinates(board, ship);

  for (let i = 1; i < ship.size; i++) {
    let nextCoordinate: [number, number] = INVALID_COORDINATE;
    if (i == 1) nextCoordinate = getRandomAjacentCell(board, ship, []);
    else nextCoordinate = getNextAjacentCell(board, ship);
    if (nextCoordinate == INVALID_COORDINATE)
      return getRandomizedShipCoordinates(board, ship);
    ship.coordinates.push(nextCoordinate);
  }
  return ship.coordinates;
};

const getRandomAjacentCell = (
  board: Board,
  ship: Ship,
  directionsLooked: number[]
): [number, number] => {
  if (directionsLooked.length == NUM_DIRECTIONS) return INVALID_COORDINATE;
  let coordinate = ship.coordinates[ship.coordinates.length - 1];
  let direction: number = Math.floor(Math.random() * NUM_DIRECTIONS);
  while (checkDirection(directionsLooked, direction)) {
    direction = Math.floor(Math.random() * NUM_DIRECTIONS);
  }
  directionsLooked.push(direction);

  switch (direction) {
    case UP:
      if (coordinate[0] - 1 > 0) {
        if (board[coordinate[0] - 1][coordinate[1]].type == "empty") {
          ship.direction = UP;
          return [coordinate[0] - 1, coordinate[1]];
        }
      }
      break;
    case DOWN:
      if (coordinate[0] + 1 < board.length) {
        if (board[coordinate[0] + 1][coordinate[1]].type == "empty") {
          ship.direction = DOWN;
          return [coordinate[0] + 1, coordinate[1]];
        }
      }
      break;
    case LEFT:
      if (coordinate[1] - 1 > 0) {
        if (board[coordinate[0]][coordinate[1] - 1].type == "empty") {
          ship.direction = LEFT;
          return [coordinate[0], coordinate[1] - 1];
        }
      }
      break;
    case RIGHT:
      if (coordinate[1] + 1 < board.length) {
        if (board[coordinate[0]][coordinate[1] + 1].type == "empty") {
          ship.direction = RIGHT;
          return [coordinate[0], coordinate[1] + 1];
        }
      }
      break;
  }
  return getRandomAjacentCell(board, ship, directionsLooked);
};

const getNextAjacentCell = (board: Board, ship: Ship) => {
  let currentCoordinate: [number, number] =
    ship.coordinates[ship.coordinates.length - 1];
  let coordinate: [number, number] = INVALID_COORDINATE;
  switch (ship.direction) {
    case UP:
      if (currentCoordinate[0] - 1 > 0) {
        if (
          board[currentCoordinate[0] - 1][currentCoordinate[1]].type == "empty"
        )
          coordinate = [currentCoordinate[0] - 1, currentCoordinate[1]];
      }
      break;
    case DOWN:
      if (currentCoordinate[0] + 1 < board.length) {
        if (
          board[currentCoordinate[0] + 1][currentCoordinate[1]].type == "empty"
        )
          coordinate = [currentCoordinate[0] + 1, currentCoordinate[1]];
      }
      break;
    case LEFT:
      if (currentCoordinate[1] - 1 > 0) {
        if (
          board[currentCoordinate[0]][currentCoordinate[1] - 1].type == "empty"
        )
          coordinate = [currentCoordinate[0], currentCoordinate[1] - 1];
      }
      break;
    case RIGHT:
      if (currentCoordinate[1] + 1 < board.length) {
        if (
          board[currentCoordinate[0]][currentCoordinate[1] + 1].type == "empty"
        )
          coordinate = [currentCoordinate[0], currentCoordinate[1] + 1];
      }
      break;
  }

  return coordinate;
};

const checkDirection = (directionsLooked: number[], direction: number) => {
  for (let dir of directionsLooked) {
    if (dir == direction) return true;
  }
  return false;
};

const makeGuess = (board: Board) => {
  PrintBoard(board);
  const input: string =
    createPrompt("Make a guess eg.. A1, B2, etc..  ").value ?? "";
  if (regex.test(input)) {
    if (board[input.charCodeAt(0) - 65][Number(input[1])].hit) {
      console.log("You've already chosen there.");
    } else if (
      board[input.charCodeAt(0) - 65][Number(input[1])].type != "empty"
    ) {
      console.log("Hit!");
    } else {
      console.log("Miss.");
    }
    board[input.charCodeAt(0) - 65][Number(input[1])].hit = true;
  } else {
    console.log("Invalid Input: Please guess again.");
  }
};

const shipsNotSank = (board: Board) => {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board.length; j++) {
      if (
        (board[i][j].type == "small" || board[i][j].type == "large") &&
        !board[i][j].hit
      )
        return true;
    }
  }
  return false;
};

const RunGame = async () => {
  console.log("Welcome to Battleship 🚢\n");

  const result = createSelection(
    [{ text: "4x4" }, { text: "5x5" }, { text: "6x6" }],
    {
      headerText: "Choose a Board Size",
    }
  );

  let board: Board = [];

  switch (result.selectedIndex) {
    case 0:
      board = InitBoard(SMALL_BOARD);
      regex = /^[A-D][0-3]$/;
      break;
    case 1:
      board = InitBoard(MEDIUM_BOARD);
      regex = /^[A-E][0-4]$/;
      break;
    case 2:
      board = InitBoard(LARGE_BOARD);
      regex = /^[A-F][0-5]$/;
      break;
  }

  while (shipsNotSank(board)) {
    makeGuess(board);
    await wait(1000);
    console.clear();
  }
  console.log(youWinText);
};

RunGame();
