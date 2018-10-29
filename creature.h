#ifndef CREATURE_H
#define CREATURE_H

class Creature {
    public:
        virtual ~Creature();
        /*
         * Returns true if creature should be deleted.
         */
        virtual bool update() = 0;
};

#endif // CREATURE_H
