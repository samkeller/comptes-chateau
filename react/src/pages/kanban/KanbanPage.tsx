import { ProgressSpinner } from "primereact/progressspinner";
import { PageTemplate } from "../PageTemplate";
import { useEffect, useState } from "react";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import KanbanColumnDisplay from "./KanbanColumnDisplay";
import KanbanColumn from "../../interfaces/kanban/KanbanColumn";
import KanbanTaskDialog from "./KanbanTaskDialog";
import FillRemainingHeight from "../../components/layout/FillRemainingHeight";



export default function KanbanPage() {
    const service = new KanbanService();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);


    useEffect(() => {
        loadBoard();
    }, []);

    function loadBoard() {
        setLoading(true);
        service.getBoardData()
            .then(boardData => {
                setColumns(boardData.columns);
                setTasks(boardData.tasks);
                setLoading(false);
            });
    }


    return (
        <PageTemplate pageTitle="Kanban">
            {loading ? (
                <div className="w-full flex justify-content-center p-5">
                    <ProgressSpinner />
                </div>
            ) : (
                <FillRemainingHeight>

                    <div className="flex flex-row w-full h-full gap-3">
                        {
                            selectedTask && (
                                <KanbanTaskDialog
                                    columns={columns}
                                    task={selectedTask}
                                    closeDialog={(reloadList) => {
                                        setSelectedTask(null);
                                        if (reloadList) {
                                            loadBoard();
                                        }
                                    }}
                                />
                            )
                        }
                        {
                            columns.map(column => (
                                <div className="flex-1" key={column.id}>
                                    <KanbanColumnDisplay
                                        column={column}
                                        tasks={tasks.filter(t => t.columnId === column.id)}
                                        reloadTasks={loadBoard}
                                        setSelectedTask={setSelectedTask}
                                    />
                                </div>
                            ))
                        }
                    </div>
                </FillRemainingHeight>
            )}
        </PageTemplate>
    );
}
