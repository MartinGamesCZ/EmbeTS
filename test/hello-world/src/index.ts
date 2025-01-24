import { board, PinMode } from "embets:hardware";

board.pins[0].setMode(PinMode.OUTPUT);
board.pins[0].setState(true);
