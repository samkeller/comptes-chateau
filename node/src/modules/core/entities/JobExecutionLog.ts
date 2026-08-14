import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

export enum JobExecutionStatus {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info'
}

@Entity('job_execution_log')
export class JobExecutionLog {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255 })
    jobName: string;

    @Column({ type: 'simple-enum', enum: JobExecutionStatus })
    status: JobExecutionStatus;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @CreateDateColumn()
    createdAt: Date;
}
