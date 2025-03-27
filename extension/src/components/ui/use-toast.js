import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

// Toast context
const ToastContext = React.createContext({})

function toastReducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === "all"
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === "all") {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

function useToast() {
  const [state, dispatch] = React.useContext(ToastContext)

  const toast = React.useMemo(() => {
    function toast({ ...props }) {
      const id = genId()
      const update = (props) =>
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })
      const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      return {
        id,
        dismiss,
        update,
      }
    }

    return {
      ...toast,
      dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
      dismissAll: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: "all" }),
    }
  }, [dispatch])

  return toast
}

function ToastContainer({ children }) {
  const [state, dispatch] = React.useReducer(toastReducer, {
    toasts: [],
  })

  React.useEffect(() => {
    const timeouts = new Map()

    state.toasts.forEach((toast) => {
      if (!toast.open && !timeouts.has(toast.id)) {
        timeouts.set(
          toast.id,
          setTimeout(() => {
            timeouts.delete(toast.id)
            dispatch({ type: actionTypes.REMOVE_TOAST, toastId: toast.id })
          }, TOAST_REMOVE_DELAY)
        )
      }
    })

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [state.toasts])

  return (
    <ToastContext.Provider value={[state, dispatch]}>
      <ToastProvider>
        {children}
        <ToastViewport />
        {state.toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
      </ToastProvider>
    </ToastContext.Provider>
  )
}

export { useToast, ToastContainer }
