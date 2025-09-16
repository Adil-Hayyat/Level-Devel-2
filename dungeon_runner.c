#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#ifdef _WIN32
  #define CLEAR "cls"
#else
  #define CLEAR "clear"
#endif

// Simple Dungeon Runner - 2 levels
// Controls: enter numeric choices when prompted.

typedef struct {
    char name[32];
    int max_hp;
    int hp;
    int attack;
    int level;
    int potions;
} Player;

typedef struct {
    char name[32];
    int hp;
    int attack;
} Enemy;

void pause_enter() {
    printf("\nPress Enter to continue...");
    while (getchar() != '\n') {}
}

int rand_range(int a, int b) { // inclusive
    return a + rand() % (b - a + 1);
}

Enemy make_enemy_for_level(int lvl, int index) {
    Enemy e;
    if (lvl == 1) {
        snprintf(e.name, sizeof(e.name), "Goblin #%d", index+1);
        e.hp = rand_range(10, 20);
        e.attack = rand_range(3, 6);
    } else { // level 2
        snprintf(e.name, sizeof(e.name), "Orc #%d", index+1);
        e.hp = rand_range(18, 32);
        e.attack = rand_range(5, 9);
    }
    return e;
}

void show_status(Player *p) {
    printf("\n=== %s ===\nHP: %d/%d   Attack: %d   Potions: %d   Level: %d\n",
           p->name, p->hp, p->max_hp, p->attack, p->potions, p->level);
}

void player_attack(Player *p, Enemy *e) {
    int damage = rand_range(p->attack - 1, p->attack + 2);
    if (damage < 1) damage = 1;
    e->hp -= damage;
    printf("%s attacks %s for %d damage!\n", p->name, e->name, damage);
}

void enemy_attack(Enemy *e, Player *p) {
    int damage = rand_range(e->attack - 1, e->attack + 1);
    if (damage < 1) damage = 1;
    p->hp -= damage;
    printf("%s hits %s for %d damage!\n", e->name, p->name, damage);
}

void use_potion(Player *p) {
    if (p->potions <= 0) {
        printf("No potions left!\n");
        return;
    }
    int heal = rand_range(8, 15);
    p->hp += heal;
    if (p->hp > p->max_hp) p->hp = p->max_hp;
    p->potions--;
    printf("%s uses a potion and heals %d HP!\n", p->name, heal);
}

int battle(Player *p, Enemy *e) {
    printf("\n--- Battle Start: %s vs %s ---\n", p->name, e->name);
    while (p->hp > 0 && e->hp > 0) {
        show_status(p);
        printf("%s: %d HP | %s: %d HP\n", p->name, p->hp, e->name, e->hp);
        printf("\nChoose action:\n1) Attack\n2) Use Potion\n3) Try to Flee (50%% chance)\nEnter choice: ");
        int choice = 0;
        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n') {}
            choice = 0;
        }
        while (getchar() != '\n') {} // clear newline

        if (choice == 1) {
            player_attack(p, e);
        } else if (choice == 2) {
            use_potion(p);
        } else if (choice == 3) {
            int roll = rand_range(1, 100);
            if (roll <= 50) {
                printf("%s successfully fled!\n", p->name);
                return 2; // fled
            } else {
                printf("Flee failed!\n");
            }
        } else {
            printf("Invalid option, you lose your turn!\n");
        }

        if (e->hp > 0) {
            enemy_attack(e, p);
        }
    }

    if (p->hp <= 0) {
        printf("\n%s was defeated by %s...\n", p->name, e->name);
        return 0; // lost
    } else {
        printf("\n%s defeated %s!\n", p->name, e->name);
        return 1; // won
    }
}

void level_loop(Player *p, int lvl) {
    int enemies_count = (lvl == 1) ? 3 : 4;
    printf("\n=== Entering Level %d ===\n", lvl);
    pause_enter();

    for (int i = 0; i < enemies_count; ++i) {
        system(CLEAR);
        Enemy e = make_enemy_for_level(lvl, i);
        printf("You encounter %s (HP: %d, Attack: %d)\n", e.name, e.hp, e.attack);

        int result = battle(p, &e);
        if (result == 0) { // died
            printf("Game Over. You reached level %d.\n", lvl);
            return;
        } else if (result == 2) { // fled
            // Flee penalty: lose small HP
            int penalty = rand_range(2, 5);
            p->hp -= penalty;
            if (p->hp < 0) p->hp = 0;
            printf("While fleeing you lost %d HP.\n", penalty);
            // choose: continue or retreat to camp
            printf("Do you want to continue this level? 1) Yes  2) No (retreat to camp)\nChoice: ");
            int ch;
            if (scanf("%d", &ch) != 1) { while (getchar() != '\n'); ch = 2; }
            while (getchar() != '\n') {}
            if (ch != 1) {
                printf("You retreated to camp and skip remaining enemies.\n");
                break;
            }
        } else { // won
            // Reward: small heal and chance for potion
            int heal = rand_range(2, 6);
            p->hp += heal;
            if (p->hp > p->max_hp) p->hp = p->max_hp;
            int chance = rand_range(1, 100);
            if (chance <= (lvl == 1 ? 40 : 25)) {
                p->potions++;
                printf("You found a potion!\n");
            }
            printf("You recover %d HP after the fight.\n", heal);
            pause_enter();
        }
        if (p->hp <= 0) {
            printf("You collapsed from wounds...\n");
            return;
        }
    }

    printf("\nLevel %d cleared!\n", lvl);
    // Level rewards
    p->level++;
    p->max_hp += (lvl == 1 ? 5 : 8);
    p->attack += (lvl == 1 ? 1 : 2);
    p->hp = p->max_hp; // full heal at level end
    printf("You leveled up! Now Level %d. Max HP: %d, Attack: %d\n", p->level, p->max_hp, p->attack);
    pause_enter();
}

int main() {
    srand((unsigned int)time(NULL));
    system(CLEAR);
    printf("Welcome to Dungeon Runner (2 levels)!\n\nEnter your hero name: ");
    Player player;
    fgets(player.name, sizeof(player.name), stdin);
    // remove newline
    size_t ln = strlen(player.name);
    if (ln > 0 && player.name[ln-1] == '\n') player.name[ln-1] = '\0';
    if (strlen(player.name) == 0) strcpy(player.name, "Hero");

    player.level = 1;
    player.max_hp = 40;
    player.hp = player.max_hp;
    player.attack = 6;
    player.potions = 2;

    printf("\nHello %s! Prepare for adventure.\n", player.name);
    pause_enter();

    // Level 1
    level_loop(&player, 1);
    if (player.hp <= 0) {
        printf("\n%s's journey ends here. Try again!\n", player.name);
        return 0;
    }

    // Ask to continue to level 2
    system(CLEAR);
    printf("\nDo you want to enter Level 2 (harder)?\n1) Yes\n2) No (End game with current progress)\nChoice: ");
    int ch = 0;
    if (scanf("%d", &ch) != 1) ch = 1;
    while (getchar() != '\n') {}
    if (ch != 1) {
        printf("You chose to end your adventure. Final Level: %d\n", player.level);
        return 0;
    }

    // Level 2
    level_loop(&player, 2);
    if (player.hp <= 0) {
        printf("\n%s fought bravely. Game Over.\n", player.name);
        return 0;
    }

    printf("\nCongratulations %s! You finished the 2 levels of Dungeon Runner.\n", player.name);
    printf("Final stats: Level %d | Max HP %d | Attack %d | Potions %d\n",
           player.level, player.max_hp, player.attack, player.potions);
    return 0;
}
