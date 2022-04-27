import { Request } from 'express';
import { isNil, omit } from 'lodash';
import { Category } from '../../../db/models';
import { ApiMessages } from '../../shared/api-messages';
import { DefaultResponse } from '../../shared/interfaces';
import { CategoryListResponse, CategoryRequest, CategoryResponse, ChangeCategoryRequest } from './category.interfaces';

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags:
 *       - Category
 *     summary: Allow to get list of categories
 *     description: "Allow to get list of categories. Available for roles: ALL"
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *         description: Return list of categories
 */
export async function handleGetCategoriesList(req: Request, res: CategoryListResponse) {
    try {
        const categories: any = await Category.findAll({
            raw: true,
        });

        const result = categories.map((el: any) => {
            return omit(el, ['createdAt', 'updatedAt']);
        });

        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.category.noCategory + err });
    }
}

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   get:
 *     tags:
 *       - Category
 *     summary: Allow to get category by id
 *     description: "Allow to get category by id. Available for roles: ALL"
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *         description: Return requested category information
 */
export async function handleGetCategoryById(req: Request, res: CategoryResponse) {
    const categoryId = req.params.id;

    try {
        const category: any = await Category.findOne({
            raw: true,
            where: {
                id: categoryId,
            },
        });

        if (isNil(category)) {
            return res.status(404).json({ errors: ApiMessages.category.noCategory });
        }

        return res.status(200).json(category);
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.category.noCategory + ': ' + err });
    }
}

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags:
 *       - Category
 *     summary: Allow to add category
 *     description: "Allow to add category. Available for roles: admin"
 *     requestBody:
 *       content:
 *         json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *         description: Return created category information
 */
export async function handlePostCategory(req: CategoryRequest, res: CategoryResponse) {
    try {
        const createdCategory: any = await Category.create({
            title: req.body.title,
        });

        res.status(200).json(createdCategory.toJSON());
    } catch (err: any) {
        if (err.toString().includes('SequelizeUniqueConstraintError')) {
            return res.status(400).json({ errors: ApiMessages.category.uniqueFields });
        }

        return res.status(500).json({
            errors: ApiMessages.category.unableCreateCategory + err,
        });
    }
}

/**
 * @swagger
 * /api/v1/categories:
 *   put:
 *     tags:
 *       - Category
 *     summary: Allow to change category
 *     description: "Allow to change category. Available for roles: admin"
 *     requestBody:
 *       content:
 *         json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *         description: Return changed category information
 */
export async function handlePutCategory(req: ChangeCategoryRequest, res: CategoryResponse) {
    const categoryId = req.body.id;
    try {
        const foundCategory = await Category.findByPk(categoryId);

        if (isNil(foundCategory)) {
            return res.status(404).json({ errors: ApiMessages.category.noCategory });
        }

        await foundCategory.update(req.body);

        const result: any = foundCategory.toJSON();
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.category.unableChangeCategory + err });
    }
}

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Category
 *     summary: Allow to remove category by id
 *     description: "Allow to remove category by id. Available for roles: admin"
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/DefaultResponse'
 *         description: Return operation result or an error
 */
export async function handleDeleteCategory(req: Request, res: DefaultResponse) {
    const categoryId = req.params.id;

    try {
        await Category.destroy({
            where: {
                id: categoryId,
            },
        });
        return res.status(200).json({ result: ApiMessages.common.removeSuccess });
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.category.unableRemoveCategory + err });
    }
}