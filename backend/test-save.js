const { Category } = require('./models');

async function test() {
  try {
    const category = await Category.findOne();
    if (!category) {
      console.log("No category found");
      return;
    }
    
    console.log("Found category:", category.toJSON());
    
    // Simulate what happens in controller
    category.category_name = category.category_name; // unchanged
    category.requires_expired_date = category.requires_expired_date; // unchanged
    
    await category.save();
    console.log("Save successful!");
  } catch (err) {
    console.error("Error during save:", err);
  }
}

test().then(() => process.exit());
