import { create } from "zustand";
import classes from "./Snackbar.module.css";

const Notifications = () => {
  const list = useSnackbar((state) => state.list);

  return (
    <div className={classes.snackbar}>
      {Object.entries(list).map(([key, value]) => (
        <div key={key} className={classes.toast}>
          <span>{key}</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
};

export default Notifications;

type Snack = {
  list: { [key: string]: string };
};

const useSnackbar = create<Snack>(() => ({
  list: {},
}));

export const toast = (key: string, message: string) =>
  useSnackbar.setState((state) => {
    const newList = state.list;
    newList[key] = message;
    return { list: newList };
  });
