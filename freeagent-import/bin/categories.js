import { apiRequest } from '../src/client.js';

const GROUPS = [
  'income_categories',
  'cost_of_sales_categories',
  'admin_expenses_categories',
  'general_categories',
];

const { ...data } = await apiRequest('/categories');

for (const group of GROUPS) {
  const categories = data[group];
  if (!categories || !categories.length) continue;

  console.log(`\n${group}`);
  console.log('-'.repeat(group.length));
  for (const category of categories) {
    console.log(`${category.nominal_code ?? ''}\t${category.description}\t${category.url}`);
  }
}
