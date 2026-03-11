import { ProgressSpinner } from "primereact/progressspinner";
import { PageTemplate } from "../PageTemplate";
import { useEffect, useState } from "react";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import KanbanColumnDisplay from "./KanbanColumnDisplay";
import KanbanColumn from "../../interfaces/kanban/KanbanColumn";
import EditKanbanTaskDialog from "./EditKanbanTaskDialog";
import FillRemainingHeight from "../../components/layout/FillRemainingHeight";



export default function KanbanPage() {
    const service = new KanbanService();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [showDialog, setShowDialog] = useState(false);


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
                            showDialog && (
                                <></>
                                // <EditKanbanTaskDialog
                                //     columns={columns}
                                //     closeDialog={(reloadList) => {
                                //         setShowDialog(false);
                                //         if (reloadList) {
                                //             loadBoard();
                                //         }
                                //     }}
                                // />
                            )
                        }
                        {
                            columns.map(column => (
                                <div className="flex-1" key={column.id}>
                                    <KanbanColumnDisplay
                                        column={column}
                                        tasks={tasks.filter(t => t.columnId === column.id)}
                                        reloadTasks={loadBoard}
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
