import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@PrimaryColumn()
	id42: number;

	@Column({ unique: true })
	username: string;

	@Column({ nullable: true })
	otp: string;
}
