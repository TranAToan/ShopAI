import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ReduxCartState = { count: number };

const initialState: ReduxCartState = { count: 0 };

const cartSlice = createSlice({
  name: 'reduxCartPractice',
  initialState,
  reducers: {
    increment: state => {
      state.count += 1;
    },
    decrement: state => {
      state.count = Math.max(0, state.count - 1);
    },
    setCount: (state, action: PayloadAction<number>) => {
      state.count = Math.max(0, action.payload);
    },
  },
});

export const { increment, decrement, setCount } = cartSlice.actions;
export default cartSlice.reducer;