import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true, nullable: true })
	id42: number;

	@Column({ unique: true })
	username: string;

	@Column({ nullable: true, select: false })
	otp: string;
}
