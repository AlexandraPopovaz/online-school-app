import { DataTypes, ModelDefined, Optional } from 'sequelize';
import { Permission, User } from '.';
import { DbCommonAttributes } from '../interfaces/common.db';
import sequelize from '../sequelize';

interface RoleAttributes extends DbCommonAttributes {
    role: string;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id'> {}

export const Role: ModelDefined<RoleAttributes, RoleCreationAttributes> = sequelize.define('role', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

User.belongsTo(Role, { onUpdate: 'CASCADE', onDelete: 'CASCADE', foreignKey: 'role', as: 'fkRole' });

Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });
