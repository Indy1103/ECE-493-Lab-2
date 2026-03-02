interface AssignedPaperAccessAlertProps {
  tone: "info" | "warning" | "error";
  message: string;
}

export function AssignedPaperAccessAlert(props: AssignedPaperAccessAlertProps): JSX.Element {
  return (
    <p role="status" data-tone={props.tone}>
      {props.message}
    </p>
  );
}
