export interface EditorProject {
  id: string;
  name: string;
  roomId: string;
  ownership: "owned" | "collaborator";
}
