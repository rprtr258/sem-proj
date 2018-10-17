#ifndef RECTANGLE_H
#define RECTANGLE_H

class MyRectangle {
    public:
        MyRectangle();
        MyRectangle(const int &_left, const int &_top, const int &_right, const int &_bottom);

        void moveHorizontal(const int &dx);
        void moveVertical(const int &dy);

    public:
        int left, right, top, bottom;
};

#endif // RECTANGLE_H
