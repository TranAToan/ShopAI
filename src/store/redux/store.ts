import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';

export const reduxStore = configureStore({
  reducer: { cartPractice: cartReducer },
});

export type RootState = ReturnType<typeof reduxStore.getState>;
export type AppDispatch = typeof reduxStore.dispatch;